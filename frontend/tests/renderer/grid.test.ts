import { describe, it, expect, beforeEach } from 'vitest';
import { Grid } from '../../src/renderer/Grid';

describe('Grid', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(10, 5);
  });

  it('inicia com chars vazios (espaço)', () => {
    expect(grid.cols).toBe(10);
    expect(grid.rows).toBe(5);
    expect(grid.getChar(0, 0)).toBe(' ');
    expect(grid.getChar(9, 4)).toBe(' ');
  });

  it('escreve um caractere em uma posição', () => {
    grid.setChar(3, 2, 'X');
    expect(grid.getChar(3, 2)).toBe('X');
  });

  it('escreve uma string horizontal', () => {
    grid.writeText(0, 0, 'HELLO');
    expect(grid.getChar(0, 0)).toBe('H');
    expect(grid.getChar(1, 0)).toBe('E');
    expect(grid.getChar(2, 0)).toBe('L');
    expect(grid.getChar(3, 0)).toBe('L');
    expect(grid.getChar(4, 0)).toBe('O');
  });

  it('trunca strings que ultrapassam a largura', () => {
    grid.writeText(7, 0, 'HELLO'); // só cabem 3 chars (7,8,9)
    expect(grid.getChar(7, 0)).toBe('H');
    expect(grid.getChar(8, 0)).toBe('E');
    expect(grid.getChar(9, 0)).toBe('L');
    // chars 'L' e 'O' são descartados (fora do grid)
  });

  it('limpa o grid (clear)', () => {
    grid.writeText(0, 0, 'HELLO');
    grid.clear();
    expect(grid.getChar(0, 0)).toBe(' ');
    expect(grid.getChar(4, 0)).toBe(' ');
  });

  it('marca dirty quando escreve, limpa após render', () => {
    expect(grid.isDirty()).toBe(false);
    grid.setChar(0, 0, 'X');
    expect(grid.isDirty()).toBe(true);
    grid.markRendered();
    expect(grid.isDirty()).toBe(false);
  });

  it('coordenadas fora do grid são ignoradas (não crash)', () => {
    expect(() => grid.setChar(-1, 0, 'X')).not.toThrow();
    expect(() => grid.setChar(0, -1, 'X')).not.toThrow();
    expect(() => grid.setChar(100, 0, 'X')).not.toThrow();
    expect(() => grid.setChar(0, 100, 'X')).not.toThrow();
  });

  it('getChar fora do grid retorna espaço', () => {
    expect(grid.getChar(-1, 0)).toBe(' ');
    expect(grid.getChar(100, 100)).toBe(' ');
  });

  it('exporta linhas como array de strings', () => {
    grid.writeText(0, 0, 'HELLO');
    grid.writeText(0, 1, 'WORLD');
    const lines = grid.toLines();
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe('HELLO     ');
    expect(lines[1]).toBe('WORLD     ');
    expect(lines[2]).toBe('          ');
  });

  it('redimensiona preservando conteúdo dentro dos novos limites', () => {
    grid.writeText(0, 0, 'HELLO');
    grid.resize(15, 8);
    expect(grid.cols).toBe(15);
    expect(grid.rows).toBe(8);
    expect(grid.getChar(0, 0)).toBe('H');
    expect(grid.getChar(4, 0)).toBe('O');
  });
});
