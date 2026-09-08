'use client';

import { useActionState, useRef, useState } from 'react';
import { Avatar } from '@/components/avatar';
import { Button, Notice } from '@/components/ui';
import { removeAvatar, uploadAvatar, type AvatarState } from './actions';

const initialState: AvatarState = { error: null };

export function AvatarForm({
  displayName,
  avatarUrl,
}: {
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadAvatar, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeAvatar, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChosen() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  const error = uploadState.error ?? removeState.error;
  // The preview is a guess about what is about to be saved. A failed upload
  // never happened, so it falls back to what the account actually has rather
  // than leaving somebody looking at a photo that was not saved.
  const shown = error ? avatarUrl : (preview ?? avatarUrl);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar url={shown} name={displayName} size={72} />

      <div className="flex-1 space-y-3">
        <form action={uploadAction}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Your photo</span>
            <input
              ref={inputRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChosen}
              // text-base, not text-sm: this is a real text field as far as iOS
              // Safari is concerned, and anything under 16px makes it zoom the
              // whole page in on focus. file:text-sm is the button label, a
              // separate pseudo-element iOS does not zoom for.
              className="block w-full text-base file:mr-3 file:rounded-[5px] file:border file:border-rule-strong file:bg-paper file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-paper-sunk"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">JPEG, PNG or WEBP, up to 5MB.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={uploadPending}>
              {uploadPending ? 'Uploading…' : 'Save photo'}
            </Button>
            {avatarUrl ? (
              <Button
                type="submit"
                formAction={removeAction}
                variant="outline"
                size="sm"
                disabled={removePending}
              >
                {removePending ? 'Removing…' : 'Remove photo'}
              </Button>
            ) : null}
          </div>
        </form>

        {error ? (
          <Notice tone="warn">
            <strong>{error}</strong>
          </Notice>
        ) : null}
      </div>
    </div>
  );
}
