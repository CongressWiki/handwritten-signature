import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetSignatureStylesForTests } from './src/styles';

afterEach(() => {
  cleanup();
  resetSignatureStylesForTests();
});
