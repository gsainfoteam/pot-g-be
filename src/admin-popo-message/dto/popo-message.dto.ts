import {
  PopoMessageVariable,
  PopoTimingAnchor,
} from "@src/popo/popo-message-meta";

export class PopoMessageDto {
  type: string;
  title: string;
  description: string;
  message: string;
  action_btns: string[];
  variables: PopoMessageVariable[];
  enabled: boolean;
  timing_anchor: PopoTimingAnchor | null;
  /** Negative means before the anchor, positive means after. Null means immediate. */
  offset_minutes: number | null;
  updated_at: string;
}
