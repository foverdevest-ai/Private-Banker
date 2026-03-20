import { describe, expect, it } from "vitest";
import { pickChatTool } from "@/lib/ai/tools";

describe("chat tool selection", () => {
  it("selects deterministic tools by intent", () => {
    expect(pickChatTool("What is my total net worth right now?")).toBe("NET_WORTH");
    expect(pickChatTool("Show spending by category in February")).toBe("SPENDING");
    expect(pickChatTool("Summarize this mortgage document")).toBe("DOCUMENT");
    expect(pickChatTool("Explain inflation")).toBe("GENERAL");
  });
});
