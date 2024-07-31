// tests/Controller/WebhookControllerTest.php

namespace Tests\Controller;

use Alaska\SyliusSmartpayPlugin\Repository\PaymentRepository;
use Alaska\SyliusSmartpayPlugin\Service\MerchantKeyService;
use Doctrine\ORM\EntityManagerInterface;
use GuzzleHttp\Client;
use SM\Factory\Factory;
use Sylius\Component\Core\Repository\OrderRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Request;
use Sylius\Component\Core\OrderPaymentTransitions;

class WebhookControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;
    private $merchantKeyService;
    private $factory;
    private $orderManager;
    private $paymentRepository;

    public function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->merchantKeyService = $this->createMock(MerchantKeyService::class);
        $this->factory = $this->createMock(Factory::class);
        $this->orderManager = $this->createMock(OrderRepositoryInterface::class);
        $this->paymentRepository = $this->createMock(PaymentRepository::class);
    }

    public function testPaymentWebhookAction()
    {
        $data = [
            'eventType' => 'status.updated',
            'objectId' => '123',
            'objectType' => 'payment',
            'paymentStatus' => 'CAPTURED'
        ];

        $this->paymentRepository->method('findWithTransaction')
            ->willReturn($this->getMockPayment('new'));

        $this->client->request(
            'POST',
            '/payment-webhook',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $this->assertEquals(200, $this->client->getResponse()->getStatusCode());
    }

    public function testRefundWebhookAction()
    {
        $data = [
            'eventType' => 'status.updated',
            'objectId' => '123',
            'objectType' => 'refund',
            'paymentStatus' => 'REFUNDED'
        ];

        $this->paymentRepository->method('findWithTransaction')
            ->willReturn($this->getMockPayment('refunded'));

        $this->client->request(
            'POST',
            '/payment-webhook',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $this->assertEquals(200, $this->client->getResponse()->getStatusCode());
    }

    private function getMockPayment(string $state)
    {
        $order = $this->createMock(Order::class);
        $order->method('getState')->willReturn($state);
        $order->method('setState')->willReturnCallback(function ($newState) use ($order) {
            $order->state = $newState;
        });

        $payment = $this->createMock(Payment::class);
        $payment->method('getOrder')->willReturn($order);

        return $payment;
    }
}
