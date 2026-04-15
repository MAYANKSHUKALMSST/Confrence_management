import React, { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Trash2, Plus, Users, Layout, Zap, Loader2 } from 'lucide-react';
import { Room } from '@/lib/types';

const RoomManagement = () => {
  const { rooms, isLoading, createRoom, updateRoom, deleteRoom } = useRooms();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 10,
    equipment: '',
    image_url: ''
  });

  const handleOpenDialog = (room: Room | null = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        equipment: room.equipment,
        image_url: room.image_url
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: 10,
        equipment: '',
        image_url: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom.id, room: formData });
    } else {
      createRoom.mutate(formData);
    }
    setIsDialogOpen(false);
  };

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center glass-card p-5 rounded-xl border-white/10 shadow-lg">
        <div>
          <h3 className="font-heading font-bold text-xl text-foreground">Conference Rooms</h3>
          <p className="text-sm text-foreground/70">Manage dynamic room settings and availability</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Room Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms?.map((room) => (
              <TableRow key={room.id} className="hover:bg-white/5">
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-white/10">
                    {room.image_url ? (
                      <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layout className="w-5 h-5 opacity-20" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{room.name}</TableCell>
                  <div className="flex items-center gap-1.5 text-foreground/80 font-medium text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    {room.capacity}
                  </div>
                <TableCell className="max-w-[200px] truncate text-xs text-foreground/70 italic font-medium">
                  {room.equipment || 'No equipment listed'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(room)} className="text-primary hover:text-primary hover:bg-primary/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRoom.mutate(room.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Seating Capacity</Label>
              <Input id="capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment (comma separated)</Label>
              <Input id="equipment" placeholder="Projector, TV, Whiteboard" value={formData.equipment} onChange={e => setFormData({ ...formData, equipment: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" placeholder="/room.png" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingRoom ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
