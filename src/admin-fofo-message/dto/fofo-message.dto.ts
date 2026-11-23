import {
  FofoMessageVariable,
  FofoTimingAnchor,
} from "@src/fofo/fofo-message-meta";

export class FofoMessageDto {
  type: string;
  title: string;
  description: string;
  message: string;
  action_btns: string[];
  variables: FofoMessageVariable[];
  enabled: boolean;
  timing_anchor: FofoTimingAnchor | null;
  /** Negative means before the anchor, positive means after. Null means immediate. */
  offset_minutes: number | null;
  updated_at: string;
}
