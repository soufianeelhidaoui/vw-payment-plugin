<?php

declare(strict_types=1);

namespace Alaska\SyliusSmartpayPlugin\Repository;

use Sylius\Bundle\CoreBundle\Doctrine\ORM\PaymentRepository as CorePaymentRepository;

class PaymentRepository extends CorePaymentRepository {

    public function findWithTransaction($transactionId)
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.details LIKE :transactionId')
            ->setParameter('transactionId', '%'.$transactionId .'%')
            ->getQuery()->getOneOrNullResult();
    }


}