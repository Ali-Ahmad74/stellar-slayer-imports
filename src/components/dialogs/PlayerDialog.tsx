import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayerRole } from '@/types/cricket';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2, User, Calendar, Hash, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (player: PlayerFormData) => void;
  player?: {
    id?: number;
    name: string;
    role: PlayerRole;
    batting_style: string | null;
    bowling_style: string | null;
    photo_url?: string | null;
    date_of_birth?: string | null;
    debut_date?: string | null;
    jersey_number?: number | null;
    nationality?: string | null;
    bio?: string | null;
  };
  isLoading?: boolean;
}

export interface PlayerFormData {
  id?: number;
  name: string;
  role: PlayerRole;
  batting_style: string | null;
  bowling_style: string | null;
  photo_url?: string | null;
  date_of_birth?: string | null;
  debut_date?: string | null;
  jersey_number?: number | null;
  nationality?: string | null;
  bio?: string | null;
}

const ROLES: PlayerRole[] = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const BATTING_STYLES = ['Right-handed', 'Left-handed'];
const BOWLING_STYLES = ['Right-arm Fast', 'Left-arm Fast', 'Right-arm Medium', 'Left-arm Medium', 'Right-arm Off-spin', 'Right-arm Leg-spin', 'Left-arm Orthodox', 'Left-arm Chinaman', 'None'];

export function PlayerDialog({ open, onOpenChange, onSave, player, isLoading }: PlayerDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<PlayerRole>('Batsman');
  const [battingStyle, setBattingStyle] = useState('');
  const [bowlingStyle, setBowlingStyle] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [debutDate, setDebutDate] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setRole(player.role);
      setBattingStyle(player.batting_style || '');
      setBowlingStyle(player.bowling_style || '');
      setPhotoUrl(player.photo_url || null);
      setDob(player.date_of_birth || '');
      setDebutDate(player.debut_date || '');
      setJerseyNumber(player.jersey_number ? String(player.jersey_number) : '');
      setNationality(player.nationality || '');
      setBio(player.bio || '');
    } else {
      setName('');
      setRole('Batsman');
      setBattingStyle('');
      setBowlingStyle('');
      setPhotoUrl(null);
      setDob('');
      setDebutDate('');
      setJerseyNumber('');
      setNationality('');
      setBio('');
    }
  }, [player, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `players/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('player-photos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('player-photos').getPublicUrl(filePath);
      setPhotoUrl(publicUrl);
      toast.success('Photo uploaded!');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => setPhotoUrl(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: player?.id,
      name: name.trim(),
      role,
      batting_style: battingStyle || null,
      bowling_style: bowlingStyle || null,
      photo_url: photoUrl,
      date_of_birth: dob || null,
      debut_date: debutDate || null,
      jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
      nationality: nationality || null,
      bio: bio || null,
    });
  };

  // Calculate age from DOB
  const age = dob ? (() => {
    const today = new Date();
    const birth = new Date(dob);
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
  })() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {player?.id ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <form onSubmit={handleSubmit} id="player-form">
            <div className="grid gap-4 py-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Player Photo</Label>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <div className="relative">
                      <img src={photoUrl} alt="Player" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                      <button type="button" onClick={handleRemovePhoto} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="w-4 h-4 mr-2" />{photoUrl ? 'Change Photo' : 'Upload Photo'}</>)}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Player Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter player name" required maxLength={100} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as PlayerRole)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jersey" className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Jersey #</Label>
                  <Input id="jersey" type="number" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} placeholder="e.g. 18" min={0} max={999} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="batting">Batting Style</Label>
                  <Select value={battingStyle} onValueChange={setBattingStyle}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BATTING_STYLES.map((style) => (<SelectItem key={style} value={style}>{style}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bowling">Bowling Style</Label>
                  <Select value={bowlingStyle} onValueChange={setBowlingStyle}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BOWLING_STYLES.map((style) => (<SelectItem key={style} value={style}>{style}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Personal Details */}
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Personal Details
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  {age !== null && age >= 0 && (
                    <p className="text-xs text-muted-foreground">Age: <span className="font-semibold text-foreground">{age} years</span></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="debut">Debut Date</Label>
                  <Input id="debut" type="date" value={debutDate} onChange={(e) => setDebutDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Nationality</Label>
                <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Pakistan" maxLength={50} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / About</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio about the player..." maxLength={500} rows={3} />
              </div>
            </div>
          </form>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="player-form" disabled={isLoading || !name.trim() || uploading}>
            {isLoading ? 'Saving...' : player?.id ? 'Save Changes' : 'Add Player'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
