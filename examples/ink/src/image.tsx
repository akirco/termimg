import type {BoxProps, DOMElement} from 'ink';
import {Box, measureElement, Text, useBoxMetrics, useStdout} from 'ink';
import {useEffect, useRef, useState} from 'react';
import type {ImageProtocol, ImageSource} from '../../../dist';
import {
	clearImage,
	detectProtocol,
	ensureCellSize,
	renderImage,
} from '../../../dist';

function measureAbsolute(
	node: DOMElement | null,
): {x: number; y: number} | null {
	if (!node?.yogaNode) return null;

	let x = 0;
	let y = 0;
	let current: DOMElement | null = node;

	while (current) {
		const layout = current.yogaNode?.getComputedLayout();

		if (layout) {
			x += layout.left;
			y += layout.top;
		}

		current = current.parentNode as DOMElement | null;
	}

	return {x, y};
}

function useMeasuredSize(
	width: number | string | undefined,
	height: number | string | undefined,
) {
	const ref = useRef<DOMElement>(null);
	const [measuredWidth, setMeasuredWidth] = useState(0);
	const [measuredHeight, setMeasuredHeight] = useState(0);
	const needsMeasure = typeof width === 'string' || typeof height === 'string';

	useEffect(() => {
		if (!needsMeasure) return;

		const el = ref.current;
		if (!el) return;

		const {width: w, height: h} = measureElement(el);
		if (w > 0) setMeasuredWidth(w);
		if (h > 0) setMeasuredHeight(h);
	});

	return {
		ref,
		resolvedWidth: typeof width === 'number' ? (width ?? 0) : measuredWidth,
		resolvedHeight: typeof height === 'number' ? (height ?? 0) : measuredHeight,
	};
}

export interface ImageProps extends BoxProps {
	src: ImageSource;
	protocol?: ImageProtocol | 'auto';
	width?: number | string | undefined;
	height?: number | string | undefined;
	scale?: number | undefined;
	preserveAspectRatio?: boolean | undefined;
}

interface ImageCache {
	stream: string;
	cellCols: number;
	cellRows: number;
	protocol: ImageProtocol;
}

export function Image({
	src,
	protocol: protocolProp,
	width,
	height,
	scale,
	preserveAspectRatio,
}: ImageProps) {
	const {stdout} = useStdout();
	const {
		ref: placeholderRef,
		resolvedWidth,
		resolvedHeight,
	} = useMeasuredSize(width, height);
	const [err, setError] = useState<string | null>(null);
	const [text, setText] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [placeholderDims, setPlaceholderDims] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const imageCacheRef = useRef<ImageCache | null>(null);
	const lastRenderRef = useRef<{
		x: number;
		y: number;
		cols: number;
		rows: number;
	} | null>(null);

	// subscribe to layout changes (terminal resize, etc.) via Ink's root layout listener
	useBoxMetrics(placeholderRef);

	const canLoad =
		(typeof width !== 'string' || resolvedWidth > 0) &&
		(typeof height !== 'string' || resolvedHeight > 0);

	// post-render: write or re-position the graphical image
	useEffect(() => {
		const cache = imageCacheRef.current;
		if (!cache) return;

		const pos = measureAbsolute(placeholderRef.current);
		if (!pos) return;

		const cols = cache.cellCols;
		const rows = cache.cellRows;
		const last = lastRenderRef.current;

		if (
			last &&
			last.x === pos.x &&
			last.y === pos.y &&
			last.cols === cols &&
			last.rows === rows
		) {
			return;
		}

		(async () => {
			if (last) {
				const seq = await clearImage(cache.protocol, {
					cols: last.cols,
					rows: last.rows,
					x: last.x,
					y: last.y,
				});
				if (seq) stdout.write(seq);
			}

			stdout.write(`\x1b7\x1b[${pos.y + 1};${pos.x + 1}H${cache.stream}\x1b8`);
			lastRenderRef.current = {x: pos.x, y: pos.y, cols, rows};
		})();
	});

	// unmount: clean up graphical image data
	useEffect(() => {
		return () => {
			const cache = imageCacheRef.current;
			const last = lastRenderRef.current;
			if (!cache) return;

			(async () => {
				const seq = await clearImage(cache.protocol, {
					cols: cache.cellCols,
					rows: cache.cellRows,
					x: last?.x,
					y: last?.y,
				});
				if (seq) stdout.write(seq);
			})();
		};
	}, [stdout.write]);

	// fetch and cache image
	useEffect(() => {
		if (!canLoad) return;

		let cancelled = false;

		async function load() {
			if (cancelled) return;

			setLoaded(false);
			setText(null);
			setError(null);
			setPlaceholderDims(null);

			const protocol = protocolProp
				? detectProtocol(protocolProp)
				: detectProtocol();
			const isGraphical = protocol === 'kitty' || protocol === 'sixel';

			try {
				const result = await renderImage(src, {
					protocol: protocolProp,
					cols: resolvedWidth || undefined,
					rows: resolvedHeight || undefined,
					scale,
					preserveAspectRatio,
				});

				if (cancelled) return;

				if (isGraphical) {
					const {cw, ch} = await ensureCellSize();
					const cellCols = Math.ceil(result.cols / cw);
					const cellRows = Math.ceil(result.rows / ch);
					imageCacheRef.current = {
						stream: result.stream,
						cellCols,
						cellRows,
						protocol,
					};
					setPlaceholderDims({
						width: cellCols,
						height: cellRows,
					});
					setLoaded(true);
				} else {
					setText(result.stream);
					setLoaded(true);
				}
			} catch (error: unknown) {
				if (!cancelled) setError(String(error));
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [
		src,
		protocolProp,
		resolvedWidth,
		resolvedHeight,
		scale,
		preserveAspectRatio,
		canLoad,
	]);

	if (err) {
		return (
			<Box>
				<Text color="red">Image error: {err}</Text>
			</Box>
		);
	}

	if (!loaded) {
		return (
			<Box ref={placeholderRef} width={width} height={height}>
				<Text color="gray">loading image...</Text>
			</Box>
		);
	}

	if (text !== null) {
		return <Text>{text}</Text>;
	}

	return (
		<Box
			ref={placeholderRef}
			width={placeholderDims?.width ?? resolvedWidth}
			height={placeholderDims?.height ?? resolvedHeight}
		/>
	);
}
