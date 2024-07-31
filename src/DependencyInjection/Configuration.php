<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    /**
     * @psalm-suppress UnusedVariable
     */
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('alaska_sylius_smartpay_plugin');
        $rootNode = $treeBuilder->getRootNode();
        $rootNode
            ->children()
                ->scalarNode('smartpay_base_url')->defaultValue('default')->end()
                ->scalarNode('kvps_base_url')->defaultValue('default')->end()
            ->end()
        ;

        return $treeBuilder;
    }
}
