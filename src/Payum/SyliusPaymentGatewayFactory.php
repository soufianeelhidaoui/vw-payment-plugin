<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum;

use Alaska\SyliusSmartpayPlugin\Payum\Action\ConvertPaymentAction;
use Alaska\SyliusSmartpayPlugin\Payum\Action\CreatePaymentAction;
use Alaska\SyliusSmartpayPlugin\Payum\Action\StatusAction;
use Payum\Core\Bridge\Spl\ArrayObject;
use Payum\Core\GatewayFactory;

final class SyliusPaymentGatewayFactory extends GatewayFactory
{
    protected function populateConfig(ArrayObject $config): void
    {
        $config->defaults([
            'payum.factory_name' => 'smartpay_payment',
            'payum.factory_title' => 'Smartpay',
            'payum.action.status' => new StatusAction(),
            'payum.action.convert_payment' => new ConvertPaymentAction(),
            'payum.action.create_payment' => new CreatePaymentAction()
        ]);
    }
}