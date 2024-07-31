<?php

namespace Alaska\SyliusSmartpayPlugin\Controller;


use Alaska\SyliusSmartpayPlugin\Repository\PaymentRepository;
use Alaska\SyliusSmartpayPlugin\Service\MerchantKeyService;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use SM\Factory\Factory;
use Sylius\Component\Core\Repository\OrderRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Sylius\Component\Core\OrderPaymentTransitions;

class WebhookController extends AbstractController {

    private Client $client;
    private EntityManagerInterface $entityManager;
    private MerchantKeyService $merchantKeyService;
    private Factory $factory;
    private $orderManager;

    public function __construct(EntityManagerInterface $entityManager = null, Client $client = null, MerchantKeyService $merchantKeyService, $smFactory, $orderManager)
    {
        $this->client = $client;
        $this->entityManager = $entityManager;
        $this->merchantKeyService = $merchantKeyService;
        $this->factory = $smFactory;
        $this->orderManager = $orderManager;
    }

    public function paymentWebhookAction(
        Request $request,
        PaymentRepository $paymentRepository
    )
    {
        $dataFromRequest = $request->toArray();

        // -- debug
        /*
        $this->client->post(
            'https://webhook.site/845b541e-8f48-4d34-96e4-fe8afc9d78f6',
            [
                'form_params' => $dataFromRequest
            ]
        );
        */


        if (!empty($dataFromRequest['eventType']) && $dataFromRequest['eventType'] == 'status.updated'){

            $payment = $paymentRepository->findWithTransaction($dataFromRequest['objectId']);
            if ($payment) {
                if ($dataFromRequest["objectType"] === 'payment' && $dataFromRequest['paymentStatus'] === 'CAPTURED')
                {
                    $stateMachine = $this->factory->get($payment->getOrder(), OrderPaymentTransitions::GRAPH);
                    $stateMachine->apply(OrderPaymentTransitions::TRANSITION_PAY);
                    $payment->getOrder()->setState('new');
                    $this->entityManager->flush();
                    $this->orderManager->flush();
                }
                elseif ($dataFromRequest["objectType"] === 'refund' && $dataFromRequest['paymentStatus'] === 'REFUND')
                {
                    $stateMachine = $this->factory->get($payment->getOrder(), OrderPaymentTransitions::GRAPH);
                    $stateMachine->apply(OrderPaymentTransitions::TRANSITION_REFUND);
                    $payment->getOrder()->setState('refunded');
                    $this->entityManager->flush();
                    $this->orderManager->flush();
                }
            }
        }

        return new JsonResponse();

    }
}
