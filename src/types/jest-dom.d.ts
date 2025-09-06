import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveClass(className: string): R
      toBeVisible(): R
      toHaveValue(value: string | number | string[]): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveFocus(): R
    }
  }
}