import * as React from 'react';
import { themes, convert } from '@storybook/theming';
import { Result } from 'axe-core';
import { useChannel } from '@storybook/api';
import { STORY_CHANGED } from '@storybook/core-events';
import { EVENTS } from '../constants';

interface Results {
  passes: Result[];
  violations: Result[];
  incomplete: Result[];
}

interface A11yContextStore {
  results: Results;
  setResults: (results: Results) => void;
  highlighted: string[];
  toggleHighlight: (target: string[], highlight: boolean) => void;
  clearHighlights: () => void;
  tab: number;
  setTab: (index: number) => void;
}

const colorsByType = [
  convert(themes.normal).color.negative, // VIOLATION,
  convert(themes.normal).color.positive, // PASS,
  convert(themes.normal).color.warning, // INCOMPLETION,
];

export const A11yContext = React.createContext<A11yContextStore>({
  results: {
    passes: [],
    incomplete: [],
    violations: [],
  },
  setResults: () => {},
  highlighted: [],
  toggleHighlight: () => {},
  clearHighlights: () => {},
  tab: 0,
  setTab: () => {},
});

interface A11yContextProviderProps {
  active: boolean;
}

const defaultResult = {
  passes: [],
  incomplete: [],
  violations: [],
};

export const A11yContextProvider: React.FC<A11yContextProviderProps> = ({ active, ...props }) => {
  const [results, setResults] = React.useState<Results>(defaultResult);
  const [tab, setTab] = React.useState(0);
  const [highlighted, setHighlighted] = React.useState<string[]>([]);
  const handleToggleHighlight = React.useCallback((target: string[], hightlight: boolean) => {
    setHighlighted((prevHighlighted) =>
      hightlight
        ? [...prevHighlighted, ...target]
        : prevHighlighted.filter((t) => !target.includes(t))
    );
  }, []);
  const handleClearHighlights = React.useCallback(() => setHighlighted([]), []);
  const handleSetTab = React.useCallback((index: number) => {
    handleClearHighlights();
    setTab(index);
  }, []);

  const handleReset = React.useCallback(() => {
    setTab(0);
    setResults(defaultResult);
    handleClearHighlights();
  }, []);

  const emit = useChannel({
    [STORY_CHANGED]: handleReset,
  });

  React.useEffect(() => {
    emit(EVENTS.HIGHLIGHT, { elements: highlighted, color: colorsByType[tab] });
  }, [highlighted, tab]);

  React.useEffect(() => {
    if (!active) {
      handleClearHighlights();
    }
  }, [active, handleClearHighlights]);

  if (!active) return null;

  return (
    <A11yContext.Provider
      value={{
        results,
        setResults,
        highlighted,
        toggleHighlight: handleToggleHighlight,
        clearHighlights: handleClearHighlights,
        tab,
        setTab: handleSetTab,
      }}
      {...props}
    />
  );
};

export const useA11yContext = () => React.useContext(A11yContext);
