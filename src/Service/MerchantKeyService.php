<?php

namespace Alaska\SyliusSmartpayPlugin\Service;

use GuzzleHttp\Client;

class MerchantKeyService {

    private Client $client;
    private $kvpsBaseURL;

    public function __construct(Client $client = null, $kvpsBaseURL){
        $this->client = $client;
        $this->kvpsBaseURL = getenv('AWS_HOST').'/payment-key/';
    }

    public function getAuthFromApi($merchant){
        //dd($this->kvpsBaseURL);
        $response = $this->client->get($this->kvpsBaseURL.$merchant);
        $merchantData = json_decode($response->getBody()->getContents(), true);
        if ($merchantData['message'] === 'Payment Key not found') {
            throw new \Exception('No merchant found');
        }
        return $merchantData;
    }
}