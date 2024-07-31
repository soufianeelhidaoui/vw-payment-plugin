<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum\Action\Api;

use Payum\Core\Action\ActionInterface;
use Payum\Core\GatewayAwareInterface;

interface BaseRenderableActionInterface extends ActionInterface, GatewayAwareInterface
{

}