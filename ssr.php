<?php
    function get(){
        $hasSlash = $_SERVER['REQUEST_URI'][strlen($_SERVER['REQUEST_URI'])-1] == '/' ? true : false;
        $url = "https://base.cheno.fr" . $_SERVER['REQUEST_URI'] . ($hasSlash ? '' : '/');
        $ch = curl_init();
  
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL, $url);
  
        $response = curl_exec($ch);
        return json_decode($response);
      }

    function ogFor($title, $url, $description, $image){
        if(empty($title)){
            $title = 'Cheno';
        }

        if(empty($description)){
            $description = 'Artiste sculpteur sur Fer | Nice';
        }

        if(empty($image)){
            $image = 'https://base.cheno.fr/wp-content/uploads/2019/12/logo-300x139.png';
        }

        return <<<EOD
        <title>$title</title>
        <meta property='og:title' content="$title" />
        <meta property='og:url' content="$url" />
        <meta name='description' content="$description" />
        <meta property='og:type' content="website" />
        <meta property='og:image' content="$image" />
        EOD;
    }

    $response = get();
    $title = $response->title;
    $description = $response->description;
    $image = $response->image;
    $url = $response->url;
?>
