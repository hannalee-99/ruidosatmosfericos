
import { describe, it, expect } from 'vitest';
import { COLORS } from '../../constants';

describe('Design System Constants', () => {
  it('should have the correct matrix green color', () => {
    expect(COLORS.matrixGreen).toBe('#9ff85d');
  });

  it('should have the correct deep blue for light mode accent', () => {
    expect(COLORS.deepBlue).toBe('#293fcf');
  });

  it('should have black and white defined', () => {
    expect(COLORS.black).toBe('#000000');
    expect(COLORS.white).toBe('#FFFFFF');
  });
});
