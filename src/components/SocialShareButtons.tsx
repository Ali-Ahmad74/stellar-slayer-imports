import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialShareButtonsProps {
  playerName: string;
  stats?: {
    total_runs?: number;
    wickets?: number;
    matches?: number;
  } | null;
  teamName?: string;
}

export function SocialShareButtons({ playerName, stats, teamName }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const url = window.location.href;
  const text = `🏏 ${playerName}${teamName ? ` (${teamName})` : ''}\n` +
    `${stats?.matches || 0} Matches | ${stats?.total_runs || 0} Runs | ${stats?.wickets || 0} Wickets\n` +
    `Check out the full profile:`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${playerName} - Cricket Stats`, text, url });
      } catch {}
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* WhatsApp */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-green-500/30 hover:bg-green-500/10 hover:border-green-500 text-green-600 dark:text-green-400"
        onClick={() => window.open(whatsappUrl, '_blank')}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>

      {/* Twitter/X */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => window.open(twitterUrl, '_blank')}
      >
        𝕏
        Share
      </Button>

      {/* Copy Link */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleCopyLink}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      {/* Native Share (mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleNativeShare}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      )}
    </div>
  );
}
