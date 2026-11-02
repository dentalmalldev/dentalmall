'use client';

import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AssistantOverview } from './assistant-overview';
import { AssistantAppearance } from './assistant-appearance';
import { AssistantBehaviour } from './assistant-behaviour';
import { AssistantKnowledge } from './assistant-knowledge';
import { AssistantConversations } from './assistant-conversations';

const TABS = ['overview', 'appearance', 'behaviour', 'knowledge', 'conversations'] as const;
type TabKey = (typeof TABS)[number];

// Admin → AI assistant. The active tab lives in ?tab= so it survives a reload,
// like the profile page.
export function AssistantManagement() {
  const t = useTranslations('adminAssistant');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const tab: TabKey = tabParam && TABS.includes(tabParam) ? tabParam : 'overview';

  const changeTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        {t('title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('subtitle')}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => changeTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((key) => (
          <Tab key={key} value={key} label={t(`tabs.${key}`)} sx={{ textTransform: 'none', fontWeight: 600 }} />
        ))}
      </Tabs>

      {tab === 'overview' && <AssistantOverview />}
      {tab === 'appearance' && <AssistantAppearance />}
      {tab === 'behaviour' && <AssistantBehaviour />}
      {tab === 'knowledge' && <AssistantKnowledge />}
      {tab === 'conversations' && <AssistantConversations />}
    </Box>
  );
}
