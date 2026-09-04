'use client';
// src/components/organisms/WhatsAppSendModal.tsx — WhatsApp messaging popup with quick send & status feedback.
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { PhoneNumberField } from '../atoms/PhoneNumberField';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';

export function WhatsAppSendModal({
  initialPhone,
  initialBody,
  leadId,
  contactId,
  onClose,
}: {
  initialPhone?: string;
  initialBody?: string;
  leadId?: string;
  contactId?: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [body, setBody] = useState(initialBody ?? '');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = useMutation({
    mutationFn: async () =>
      unwrap<{ ok: boolean; message: { error?: string | null } }>(
        (
          await api.post('/whatsapp/send', {
            to: phone,
            body,
            leadId,
            contactId,
          })
        ).data,
      ),
    onSuccess: (r) => {
      setResult({
        ok: r.ok,
        msg: r.ok ? (t('wa.sent') || 'Message dispatched successfully.') : `${t('wa.failed') || 'Failed'}: ${r.message.error ?? ''}`,
      });
      if (r.ok) setTimeout(onClose, 1000);
    },
    onError: () => setResult({ ok: false, msg: t('wa.notConnected') || 'WhatsApp provider is not connected.' }),
  });

  return (
    <Modal title={t('wa.sendVia') || 'Send WhatsApp Message'} onClose={onClose}>
      <div className="space-y-4">
        <PhoneNumberField
          id="wa-phone"
          label={t('field.phone') || 'Recipient Phone Number'}
          value={phone}
          onChange={setPhone}
        />
        <div>
          <Label htmlFor="wa-message">{t('wa.message') || 'Message Body'}</Label>
          <Textarea
            id="wa-message"
            rows={4}
            placeholder="Type your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => send.mutate()}
            disabled={send.isPending || !phone || !body.trim()}
            loading={send.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30 text-white"
          >
            <Send className="h-4 w-4" />
            <span>{t('wa.send') || 'Send'}</span>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>

        {result && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              result.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{result.msg}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
