<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Payum\Action\Api;


use Payum\Core\GatewayAwareTrait;
use Payum\Core\Reply\HttpResponse;
use Payum\Core\Request\RenderTemplate;

abstract class BaseRenderableAction implements BaseRenderableActionInterface
{
    use GatewayAwareTrait;

    /**
     * @param $checkoutToken
     */
    protected function renderUrl($checkoutToken, $targetURL){
        $renderTemplate = new RenderTemplate('@AlaskaSyliusSmartpayPlugin/Payment/payment.html.twig', [
            'checkoutToken' => $checkoutToken,
            'targetURL' => $targetURL
        ]);
        $this->gateway->execute($renderTemplate);
        throw new HttpResponse($renderTemplate->getResult());

    }
}