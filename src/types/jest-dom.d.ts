import '@testing-library/jest-dom';

declare global {
  namespace jest {
    // Minimal matcher type augmentation for local tests
    interface Matchers<R = void, T = Record<string, unknown>> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toHaveValue(value: string | number | string[]): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveFocus(): R;
    }
  }
}
