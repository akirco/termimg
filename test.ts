import { renderImage } from './dist';

const output = await renderImage('https://picsum.photos/seed/x/400/400', {
  scale: 0.5,
});
process.stdout.write(output);
