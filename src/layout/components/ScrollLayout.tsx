import { useState } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { SectionNodeComponent } from './SectionNodeComponent';
import { SectionHandle } from './SectionHandle';
import { SectionConfig } from './SectionConfig';

type Props = {
  root: ScrollRoot;
  nested?: boolean;
};

export function ScrollLayout({ root, nested }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);
  const [configSectionId, setConfigSectionId] = useState<string | null>(null);

  return (
    <>
      <div
        style={{
          width: '100%',
          ...(nested
            ? { height: '100%', overflowY: 'auto', overflowX: 'hidden' }
            : {}),
        }}
      >
        {root.sections.map((section, i) => (
          <div key={section.id}>
            <SectionNodeComponent
              section={section}
              onConfig={setConfigSectionId}
            />
            {editMode && (
              <SectionHandle
                aboveSectionId={section.id}
                belowSectionId={root.sections[i + 1]?.id}
              />
            )}
          </div>
        ))}
      </div>
      <SectionConfig
        open={configSectionId !== null}
        sectionId={configSectionId}
        onClose={() => setConfigSectionId(null)}
      />
    </>
  );
}
