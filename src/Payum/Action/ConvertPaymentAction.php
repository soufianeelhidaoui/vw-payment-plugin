<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum\Action;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Payum\Core\Action\ActionInterface;
use Payum\Core\Exception\RequestNotSupportedException;
use Sylius\Component\Core\Model\OrderInterface;
use Payum\Core\Request\Capture;
use Sylius\Component\Core\Model\AddressInterface;
use Sylius\Component\Core\Model\CustomerInterface;
use Sylius\Component\Core\Model\PaymentInterface;
use Webmozart\Assert\Assert;

final class ConvertPaymentAction implements ActionInterface
{


    public function __construct()
    {
    }

    public function execute($request)
    {
        RequestNotSupportedException::assertSupports($this, $request);

        /** @var PaymentInterface $payment */
        $payment = $request->getSource();
        /** @var OrderInterface $order */
        $order = $payment->getOrder();

        $customer = $order->getCustomer();
        Assert::isInstanceOf(
            $customer,
            CustomerInterface::class,
            sprintf(
                'Make sure the first model is the %s instance.',
                CustomerInterface::class
            )
        );

        /** @var AddressInterface $billingAddress */
        $billingAddress = $order->getBillingAddress();
        Assert::isInstanceOf(
            $billingAddress,
            AddressInterface::class,
            sprintf(
                'Make sure the first model is the %s instance.',
                AddressInterface::class
            )
        );

        $paymentData = [
            'merchantKey' => '73afeb44-432e-4b91-be37-a6b3d2fb7447',
            'payment' => [
                'amount' => 59.99,
                'currencyCode' => "EUR",
                'description' => 'test payment'
            ],
            'consumer' => [
                'firstName' => 'test',
                'lastName' => "test",
                'emailAddress' => 'test@test.fr'
            ],
            'billingAddress' => [
                'addressLine1' => 'Quelque part',
                'number' => "56",
                'city' => 'Paris',
                'postCode' => "75008",
                'countryCode' => 'FR'
            ]
        ];

        $request->setResult($paymentData);
    }



    public function supports($request): bool
    {

        return
            $request instanceof Capture &&
            $request->getModel() instanceof PaymentInterface
            ;
    }
}