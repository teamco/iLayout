import { useState } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { SectionNodeComponent } from './SectionNodeComponent';
import { SectionHandle } from './SectionHandle';
import { SectionConfig } from './SectionConfig';

type Props = {
  root: ScrollRoot;
};

export function ScrollLayout({ root }: Props) {
  const editMode = useLayoutStore(s => s.editMode);
  const [configSectionId, setConfigSectionId] = useState<string | null>(null);

  return (
    <>
      <div style={{ overflowY: 'auto', height: '100%', width: '100%' }}>
        {root.sections.map((section) => (
          <div key={section.id}>
            <SectionNodeComponent
              section={section}
              onConfig={setConfigSectionId}
            />
            {editMode && <SectionHandle sectionId={section.id} />}
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
