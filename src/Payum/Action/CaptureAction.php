<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum\Action;

use Alaska\SyliusSmartpayPlugin\Payum\Request\CreatePayment;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Payum\Core\Action\ActionInterface;
use Payum\Core\Bridge\Spl\ArrayObject;
use Payum\Core\Exception\RequestNotSupportedException;
use Payum\Core\GatewayAwareInterface;
use Payum\Core\GatewayAwareTrait;
use Payum\Core\Security\TokenInterface;
use Sylius\Component\Core\Model\PaymentInterface as SyliusPaymentInterface;
use Payum\Core\Request\Capture;

final class CaptureAction implements ActionInterface, GatewayAwareInterface
{
    /** @var Client */
    use GatewayAwareTrait;

    private $client;

    public function __construct(Client $client = null)
    {
        $this->client = $client;
    }

    public function execute($request): void
    {
        RequestNotSupportedException::assertSupports($this, $request);

        $data = $request->getModel();
        $details['order'] = $data->getOrder();
        $details['token'] = $request->getToken();


        $this->gateway->execute(new CreatePayment($details));
    }

    public function supports($request): bool
    {
        return
            $request instanceof Capture &&
            $request->getModel() instanceof SyliusPaymentInterface
            ;
    }
}