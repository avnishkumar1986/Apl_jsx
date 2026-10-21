<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SupportTicketNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $ticketId,
        private readonly string $ticketNumber,
        private readonly string $title,
        private readonly string $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticketId,
            'ticket_number' => $this->ticketNumber,
            'title' => $this->title,
            'message' => $this->message,
            'url' => route('support.show', $this->ticketId, false),
        ];
    }
}
