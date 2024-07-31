<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\DependencyInjection;

use Symfony\Component\Config\Definition\ConfigurationInterface;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

final class AlaskaSyliusSmartpayExtension extends Extension
{
    /**
     * @psalm-suppress UnusedVariable
     */
    public function load(array $configs, ContainerBuilder $container): void
    {
        $config = $this->processConfiguration($this->getConfiguration([], $container), $configs);
        $loader = new XmlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));

        $loader->load('services.xml');

        $configuration = $this->getConfiguration([], $container);
        //dd($config);
        //$config = $this->processConfiguration($configuration, $config);
        $container->setParameter('sylius_smartpay.smartpay_base_url', $config['smartpay_base_url']);
        $container->setParameter('sylius_smartpay.kvps_base_url', $config['kvps_base_url']);
    }

    public function getConfiguration(array $config, ContainerBuilder $container): ConfigurationInterface
    {
        return new Configuration();
    }
}
