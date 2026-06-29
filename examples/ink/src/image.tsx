import type {DOMElement} from 'ink';
import {Box, Text, useStdout} from 'ink';
import {useEffect, useRef, useState} from 'react';
import type {ImageProtocol, ImageSource} from '../../../dist/index.js';
import {detectProtocol, renderImage} from '../../../dist/index.js';

const RE_CUP = /\x1b\[\d+;\d+H/g;

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

export interface ImageProps {
	src: ImageSource;
	protocol?: ImageProtocol | 'auto';
	cols?: number;
	rows?: number;
	scale?: number;
	preserveAspectRatio?: boolean;
}

export function Image({
	src,
	protocol: protocolProp,
	cols,
	rows,
	scale,
	preserveAspectRatio,
}: ImageProps) {
	const {stdout} = useStdout();
	const ref = useRef<DOMElement>(null);
	const [err, setError] = useState<string | null>(null);
	const [text, setText] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const p = protocolProp ? detectProtocol(protocolProp) : detectProtocol();
		const isGraphical = p === 'kitty' || p === 'sixel';

		async function load() {
			if (cancelled) return;

			setReady(false);
			setText(null);
			setError(null);

			try {
				const opts: Record<string, unknown> = {
					protocol: protocolProp,
					cols,
					rows,
					scale,
					preserveAspectRatio,
				};

				if (isGraphical) {
					const pos = measureAbsolute(ref.current);

					if (!pos) return;

					opts.x = pos.x;
					opts.y = pos.y;
				}

				const result = await renderImage(src, opts);

				if (cancelled) return;

				if (isGraphical) {
					setText(null);
					setReady(true);
					stdout.write(result.stream);
				} else {
					setText(result.stream.replace(RE_CUP, '\n').replace(/^\n/, ''));
					setReady(true);
				}
			} catch (error: unknown) {
				if (!cancelled) setError(String(error));
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [src, protocolProp, cols, rows, scale, preserveAspectRatio, stdout]);

	if (err) {
		return (
			<Box>
				<Text color="red">Image error: {err}</Text>
			</Box>
		);
	}

	if (!ready) {
		return (
			<Box ref={ref} width={cols} height={rows}>
				<Text color="gray">loading image...</Text>
			</Box>
		);
	}

	if (text === null) return null;
	return <Text>{text}</Text>;
}
