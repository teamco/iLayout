import type { WidgetRef, EWidgetResource } from '../types';
import { getWidgetDef } from '../widgets/registry';

type Props = { widget: WidgetRef };

const ALIGN_STYLES: Record<string, React.CSSProperties> = {
  'top-left': { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' },
  'top-center': { display: 'flex', alignItems: 'flex-start', justifyContent: 'center' },
  'top-right': { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' },
  'center-left': { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  'center': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  'center-right': { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  'bottom-left': { display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' },
  'bottom-center': { display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  'bottom-right': { display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' },
};

export function EmbedWidgetRenderer({ widget }: Props) {
  const def = getWidgetDef(widget.resource as EWidgetResource);
  const { bounds } = widget;

  const alignStyle = ALIGN_STYLES[bounds?.align ?? 'top-left'] ?? ALIGN_STYLES['top-left'];

  const mt = bounds?.marginTop;
  const mr = bounds?.marginRight;
  const mb = bounds?.marginBottom;
  const ml = bounds?.marginLeft;
  const hasMargins = mt || mr || mb || ml;

  const style: React.CSSProperties = {
    ...alignStyle,
    width: '100%',
    height: '100%',
    position: hasMargins ? 'absolute' : 'relative',
    ...(hasMargins ? { inset: `${mt ?? 0} ${mr ?? 0} ${mb ?? 0} ${ml ?? 0}` } : {}),
  };

  if (!def) {
    return (
      <div className="al-widget" style={style}>
        <div className="al-widget-empty">{widget.widgetId}</div>
      </div>
    );
  }

  const Comp = def.component;

  return (
    <div className="al-widget" style={style}>
      <Comp
        content={widget.content ?? { value: '' }}
        config={{ isEditable: false, isClonable: true, ...widget.config }}
      />
    </div>
  );
}
