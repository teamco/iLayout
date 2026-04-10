import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbedLayoutRenderer } from '../EmbedLayoutRenderer';
import type { LeafNode, SplitterNode, ScrollRoot, GridRoot } from '../../types';
import '../../widgets/init';

const leaf: LeafNode = {
  id: 'l1',
  type: 'leaf',
  widget: {
    widgetId: 'w1',
    resource: 'empty',
    content: { value: 'Hello' },
    config: {},
  },
};

const leafNoWidget: LeafNode = { id: 'l2', type: 'leaf' };

const splitter: SplitterNode = {
  id: 's1',
  type: 'splitter',
  direction: 'horizontal',
  sizes: [60, 40],
  children: [
    leaf,
    {
      id: 'l3',
      type: 'leaf',
      widget: {
        widgetId: 'w2',
        resource: 'empty',
        content: { value: 'World' },
        config: {},
      },
    },
  ],
};

const scroll: ScrollRoot = {
  id: 'sr1',
  type: 'scroll',
  sections: [
    {
      id: 'sec1',
      type: 'section',
      height: { type: 'fixed', value: '300px' },
      child: leaf,
    },
    {
      id: 'sec2',
      type: 'section',
      height: { type: 'auto' },
      child: leafNoWidget,
      overlap: '-20px',
      zIndex: 2,
    },
  ],
};

describe('EmbedLayoutRenderer', () => {
  it('renders a leaf with widget', () => {
    const { container } = render(<EmbedLayoutRenderer root={leaf} />);
    expect(container.querySelector('.al-leaf')).not.toBeNull();
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('renders an empty leaf', () => {
    const { container } = render(<EmbedLayoutRenderer root={leafNoWidget} />);
    expect(container.querySelector('.al-leaf')).not.toBeNull();
  });

  it('renders a splitter with correct flex styles', () => {
    const { container } = render(<EmbedLayoutRenderer root={splitter} />);
    const splitterEl = container.querySelector('.al-splitter');
    expect(splitterEl).not.toBeNull();
    expect(splitterEl!.classList.contains('al-splitter--horizontal')).toBe(
      true,
    );

    const panels = container.querySelectorAll('.al-panel');
    expect(panels).toHaveLength(2);
    expect((panels[0] as HTMLElement).style.flexBasis).toBe('60%');
    expect((panels[1] as HTMLElement).style.flexBasis).toBe('40%');
  });

  it('renders a vertical splitter', () => {
    const vertical: SplitterNode = { ...splitter, direction: 'vertical' };
    const { container } = render(<EmbedLayoutRenderer root={vertical} />);
    const splitterEl = container.querySelector('.al-splitter');
    expect(splitterEl!.classList.contains('al-splitter--vertical')).toBe(true);
  });

  it('renders scroll layout with sections', () => {
    const { container } = render(<EmbedLayoutRenderer root={scroll} />);
    const scrollEl = container.querySelector('.al-scroll');
    expect(scrollEl).not.toBeNull();

    const sections = container.querySelectorAll('.al-section');
    expect(sections).toHaveLength(2);
    expect((sections[0] as HTMLElement).style.height).toBe('300px');
    expect((sections[1] as HTMLElement).style.marginTop).toBe('-20px');
    expect((sections[1] as HTMLElement).style.zIndex).toBe('2');
  });

  it('renders nested splitters', () => {
    const nested: SplitterNode = {
      id: 'outer',
      type: 'splitter',
      direction: 'horizontal',
      sizes: [50, 50],
      children: [
        leaf,
        {
          id: 'inner',
          type: 'splitter',
          direction: 'vertical',
          sizes: [30, 70],
          children: [leaf, leafNoWidget],
        },
      ],
    };
    const { container } = render(<EmbedLayoutRenderer root={nested} />);
    const splitters = container.querySelectorAll('.al-splitter');
    expect(splitters).toHaveLength(2);
  });

  it('renders grid layout with sidebars and center', () => {
    const grid: GridRoot = {
      id: 'g1',
      type: 'grid',
      columns: [
        { id: 'c1', size: '200px', child: { id: 'sl1', type: 'leaf' } },
        {
          id: 'c2',
          size: '1fr',
          child: {
            id: 'sc1',
            type: 'scroll',
            sections: [
              {
                id: 'sec1',
                type: 'section',
                height: { type: 'fixed', value: '100vh' },
                child: leaf,
              },
            ],
          } as ScrollRoot,
        },
        { id: 'c3', size: '200px', child: { id: 'sl2', type: 'leaf' } },
      ],
      headerSections: [
        {
          id: 'hs1',
          type: 'section',
          height: { type: 'min', value: '100px' },
          child: {
            id: 'hl1',
            type: 'leaf',
            widget: {
              widgetId: 'hw1',
              resource: 'empty',
              content: { value: 'Header' },
              config: {},
            },
          },
        },
      ],
      footerSections: [
        {
          id: 'fs1',
          type: 'section',
          height: { type: 'min', value: '80px' },
          child: { id: 'fl1', type: 'leaf' },
        },
      ],
    };

    const { container } = render(
      <EmbedLayoutRenderer root={grid as unknown as LeafNode} />,
    );

    // Outer flex container
    const outer = container.querySelector('.al-grid-outer');
    expect(outer).not.toBeNull();

    // Sidebars
    const sidebars = container.querySelectorAll('.al-grid-sidebar');
    expect(sidebars).toHaveLength(2);
    expect((sidebars[0] as HTMLElement).style.width).toBe('200px');
    expect((sidebars[1] as HTMLElement).style.width).toBe('200px');

    // Center
    const center = container.querySelector('.al-grid-center');
    expect(center).not.toBeNull();

    // Scroll inside center
    const scrollEl = container.querySelector('.al-scroll');
    expect(scrollEl).not.toBeNull();

    // Header text
    expect(screen.getByText('Header')).toBeDefined();

    // Sections (header + scroll section + footer = 3)
    const sections = container.querySelectorAll('.al-section');
    expect(sections).toHaveLength(3);
  });
});
