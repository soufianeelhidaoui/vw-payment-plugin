<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum\Action;

use Alaska\SyliusSmartpayPlugin\Payum\Action\Api\BaseRenderableAction;
use Alaska\SyliusSmartpayPlugin\Payum\Action\Api\BaseRenderableActionInterface;
use Alaska\SyliusSmartpayPlugin\Payum\Request\CreatePayment;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use Payum\Core\GatewayAwareTrait;

class CreatePaymentAction extends BaseRenderableAction implements BaseRenderableActionInterface
{
    use GatewayAwareTrait;


    public function __construct(EntityManagerInterface $entityManager = null, Client $client = null)
    {
        $this->client = $client;
        $this->entityManager = $entityManager;
        $this->sa_business_api = getenv('PAYMENT_SERVICE_URL');
        $this->brand = getenv('BRAND');
    }

    /**
     * @param mixed $request
     * @throws \Exception
     */
    public function execute($request): void
    {
        $details = $request->getFirstModel();
        //Call to external API to get MerchantKey + Password
        if (!method_exists($details['order'], 'getServiceCenterId')){
            throw new \Exception('Order not compatible');
        }
        $merchant = $details['order']->getServiceCenterId();

        $i=1;
        foreach ($details['order']->getItems() as $item){
            $data[] = [
                'lineNumber' => $i,
                "itemArticleId" => "".$item->getId()."",
                "itemName" => $item->getProductName(),
                "quantity" => $item->getQuantity(),
                "unitPrice" => $item->getUnitPrice()/100,
                "netAmount" => $item->getTotal()/100,
                "vatPercent" => 0,
                "vatAmount" => 0,
                "grossAmount" => 0,
            ];
            $i++;
        }


            $response = $this->client->post($this->sa_business_api."/create-checkout/".$this->brand."/".$merchant, [
                'body' => json_encode([
                    'payment' => [
                        'amount' => $details['order']->getTotal()/100,
                        'currencyCode' => "EUR",
                        'description' => 'Order from website'
                    ],
                    'consumer' => [
                        'firstName' => $details['order']->getBillingAddress()->getFirstName(),
                        'lastName' => $details['order']->getBillingAddress()->getLastName(),
                        'emailAddress' => $details['order']->getCustomer()->getEmail()
                    ],
                    'billingAddress' => [
                        'addressLine1' => $details['order']->getBillingAddress()->getStreet(),
                        'city' => $details['order']->getBillingAddress()->getCity(),
                        'postCode' =>  $details['order']->getBillingAddress()->getPostCode(),
                        'countryCode' =>  $details['order']->getBillingAddress()->getCountryCode()
                    ],
                    'order' => [
                        'externalOrderReference' => "".$details['order']->getId()."",
                        'lines' => [
                            $data
                        ]
                    ]
                ]),
                'headers' => [
                    'Content-Type' => 'application/json'
                ]
            ]);
            $data = json_decode($response->getBody()->getContents(), true);
            if ($response->getStatusCode() === 201){
                if ($data['checkoutToken'] && $data['transactionId']){
                    $payment = $this->entityManager->getRepository($details['token']->getDetails()->getClass())->find($details['token']->getDetails()->getId());
                    $paymentDetails = array_merge($payment->getDetails(), ['transactionId' => $data['transactionId'], 'merchant' => $merchant]);
                    $payment->setDetails($paymentDetails);
                    $this->entityManager->flush();
                    $this->renderUrl($data['checkoutToken'], $details["token"]->getAfterUrl());
                }
            } else {
                throw new \Exception('Error during processing payment');
            }

    }

    /**
     * @inheritDoc
     */
    public function supports($request): bool
    {
        return
            $request instanceof CreatePayment &&
            $request->getModel() instanceof \ArrayAccess;
    }
}