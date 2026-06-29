import type {BoxProps} from 'ink';
import {Box, useApp, useInput, useWindowSize} from 'ink';
import React from 'react';
import {Image} from './image';

interface FullScreenProps extends BoxProps {
	children: React.ReactNode;
}

export function FullScreen({
	children,
	flexDirection = 'column',
	...restProps
}: FullScreenProps) {
	const {columns, rows} = useWindowSize();
	const {exit} = useApp();

	useInput((input, key) => {
		if (input === 'q' || (key.ctrl && input === 'c')) {
			exit();
		}
	});

	return (
		<Box
			flexDirection={flexDirection}
			{...restProps}
			width={columns}
			height={rows}
			padding={0}
			margin={0}
		>
			{children}
		</Box>
	);
}

export default function App() {
	const src = '../opentui/sample.jpg';

	return (
		<FullScreen flexDirection="row" flexWrap="wrap" gap={5} padding={1}>
			<Box flexDirection="column">
				<Image src={src} cols={20} protocol="ascii" />
			</Box>

			<Box flexDirection="column">
				<Image src={src} cols={20} protocol="braille" />
			</Box>

			<Box flexDirection="column">
				<Image src={src} cols={20} protocol="halfblock" />
			</Box>
			<Box flexDirection="column">
				<Image src={src} cols={20} />
			</Box>
			<Box flexDirection="column">
				<Image src={src} cols={20} />
			</Box>
			<Box flexDirection="column">
				<Image src={src} cols={20} />
			</Box>
			<Box flexDirection="column">
				<Image src={src} cols={20} />
			</Box>
			<Box flexDirection="column">
				<Image src={src} cols={20} />
			</Box>
		</FullScreen>
	);
}
