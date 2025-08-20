'use client'

import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
}

export function DeleteProjectDialog({ isOpen, onClose, onConfirm, projectName }: DeleteProjectDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = inputValue === projectName;

  const handleConfirm = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      // The parent will handle closing the dialog on success/failure
    }
  };

  // Reset input when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInputValue('');
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the <strong>{projectName}</strong> project and all of its associated data.
            <br /><br />
            Please type the project name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={projectName}
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={!isMatch || isDeleting}
            variant="destructive"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}