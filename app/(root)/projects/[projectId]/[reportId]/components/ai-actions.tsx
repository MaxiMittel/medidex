import { Bot, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ReactNode, useState } from "react";

interface ReportChatButtonsProps {
  children: (dialogProps: { open: boolean; setOpen: (open: boolean) => void }) => ReactNode;
}

export function ReportChatButtons({ children }: ReportChatButtonsProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleChatClick = () => {
    setPopoverOpen(false);
    setChatOpen(true);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            className="fixed right-6 bottom-6 z-40 h-12 rounded-full px-4 shadow-lg"
            size="lg"
            type="button"
            onClick={() => setPopoverOpen((v) => !v)}
          >
            <Bot className="h-4 w-4" />
            Ask MediBot
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={12}
          className="!bg-transparent !border-0 !shadow-none p-0 w-auto"
        >
          <Button
            type="button"
            className="h-10 rounded-full w-full justify-start mb-2"
            // No click handler yet
          >
            <Sparkles className="h-4 w-4" />
            Auto Match
          </Button>
          <Button
            type="button"
            className="h-10 rounded-full w-full justify-start"
            onClick={handleChatClick}
          >
            <MessageSquareText className="h-4 w-4" />
            Chat
          </Button>
        </PopoverContent>
      </Popover>
      {children({ open: chatOpen, setOpen: setChatOpen })}
    </>
  );
}
