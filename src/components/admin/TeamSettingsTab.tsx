import { useState, useEffect } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TeamLogoUpload } from '@/components/TeamLogoUpload';
import { useTeamSettings } from '@/hooks/useTeamSettings';
import { toast } from 'sonner';

interface Props {
  isAdmin: boolean;
  saving: boolean;
  onDeleteSampleData: () => void;
}

export function TeamSettingsTab({ isAdmin, saving, onDeleteSampleData }: Props) {
  const { teamSettings, updateTeamSettings } = useTeamSettings();
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [teamDescriptionDraft, setTeamDescriptionDraft] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    if (!teamSettings) return;
    setTeamNameDraft(teamSettings.team_name || '');
    setTeamDescriptionDraft(teamSettings.description || '');
  }, [teamSettings]);

  const handleSave = async () => {
    if (!isAdmin) return;
    const name = teamNameDraft.trim();
    if (!name) { toast.error('Team name is required'); return; }
    setSavingTeam(true);
    try {
      await updateTeamSettings({ team_name: name, description: teamDescriptionDraft.trim() || null });
      toast.success('Team settings updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update team settings');
    } finally {
      setSavingTeam(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Team Settings</CardTitle><CardDescription>Manage team name, description, and logo</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <TeamLogoUpload
            currentLogoUrl={teamSettings?.team_logo_url || null}
            onLogoChange={() => {}}
            isAdmin={isAdmin}
          />
          <div className="flex-1 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-team-name">Team name</Label>
              <Input id="admin-team-name" value={teamNameDraft} onChange={(e) => setTeamNameDraft(e.target.value)} maxLength={80} placeholder="e.g., City Strikers" disabled={!isAdmin} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-team-desc">Description</Label>
              <Textarea id="admin-team-desc" value={teamDescriptionDraft} onChange={(e) => setTeamDescriptionDraft(e.target.value)} maxLength={300} className="min-h-[100px]" placeholder="Shown on the Team page" disabled={!isAdmin} />
            </div>
            {isAdmin && (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={savingTeam} onClick={() => { setTeamNameDraft(teamSettings?.team_name || ''); setTeamDescriptionDraft(teamSettings?.description || ''); }}>Reset</Button>
                <Button disabled={savingTeam} onClick={handleSave}>{savingTeam ? 'Saving…' : 'Save'}</Button>
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2"><Info className="w-4 h-4 text-muted-foreground" /><p className="font-semibold">Sample data</p></div>
                <p className="text-sm text-muted-foreground">Deletes only records whose names start with "(Sample)".</p>
              </div>
              <Button variant="destructive" className="gap-2" disabled={saving} onClick={onDeleteSampleData}>
                <Trash2 className="w-4 h-4" />Delete sample data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
