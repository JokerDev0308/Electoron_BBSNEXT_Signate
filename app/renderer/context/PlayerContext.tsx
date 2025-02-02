import React, {useContext} from 'react';
import {Page} from '../../common/models/delivery';

export interface PageEventParam {
  page?: Page;
  index?: number;
  pageNumber?: number;
  video?: any;
}

export type PlayerContextType = {
  onPlayerEvent: (event: string, params: PageEventParam) => void;
};

export const PlayerContext = React.createContext<PlayerContextType | null>(
  null
);

export function usePlayerEvent() {
  return useContext(PlayerContext);
}
