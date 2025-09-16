<?php

namespace App\Mail;

use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mime\MessageConverter;
use Symfony\Component\Mime\Email;
use SendinBlue\Client\Configuration;
use SendinBlue\Client\Api\TransactionalEmailsApi;
use SendinBlue\Client\Model\SendSmtpEmail;
use SendinBlue\Client\Model\SendSmtpEmailTo;
use SendinBlue\Client\Model\SendSmtpEmailSender;
use GuzzleHttp\Client;
use Exception;

class BrevoTransport extends AbstractTransport
{
    protected $apiKey;
    protected $apiInstance;

    public function __construct($apiKey)
    {
        $this->apiKey = $apiKey;
        
        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $this->apiKey);
        $this->apiInstance = new TransactionalEmailsApi(
            new Client(),
            $config
        );
    }

    public function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        
        $sendSmtpEmail = new SendSmtpEmail();
        
        // Configurar remitente
        $from = $email->getFrom()[0];
        $sender = new SendSmtpEmailSender();
        $sender->setEmail($from->getAddress());
        $sender->setName($from->getName());
        $sendSmtpEmail->setSender($sender);
        
        // Configurar destinatarios
        $toList = [];
        foreach ($email->getTo() as $to) {
            $toObj = new SendSmtpEmailTo();
            $toObj->setEmail($to->getAddress());
            $toObj->setName($to->getName());
            $toList[] = $toObj;
        }
        $sendSmtpEmail->setTo($toList);
        
        // Configurar asunto y contenido
        $sendSmtpEmail->setSubject($email->getSubject());
        
        if ($email->getHtmlBody()) {
            $sendSmtpEmail->setHtmlContent($email->getHtmlBody());
        }
        
        if ($email->getTextBody()) {
            $sendSmtpEmail->setTextContent($email->getTextBody());
        }
        
        // Enviar email
        try {
            $result = $this->apiInstance->sendTransacEmail($sendSmtpEmail);
        } catch (Exception $e) {
            throw new \Exception('Brevo API Error: ' . $e->getMessage());
        }
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}