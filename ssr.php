<?php
    function get(){
        $uri = $_SERVER['REQUEST_URI'];
        $hasSlash = substr($uri,-1) === '/';
        if(!$hasSlash){
            $uri .= '/';
        }

        $url = "https://base.cheno.fr" . $uri;

        $ch = curl_init();
  
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL, $url);
  
        $response = curl_exec($ch);

        // echo "<meta class='debug-ssr' content='$url' />";
        // echo "<meta class='debug-ssr' content='$response' />";

        return json_decode($response);
    }

    function ogFor($title, $url, $description, $image){
        if(empty($title)){
            $title = 'Cheno';
        } else if(strpos($title, 'Cheno') === false) {
            $title .= ' | Cheno';
        }

        if(empty($description)){
            $description = 'Artiste sculpteur sur Fer | Nice';
        }

        if(empty($image)){
            $image = 'https://base.cheno.fr/wp-content/uploads/2019/12/logo-300x139.png';
        }

        return "<title>$title</title><meta name='description' content='$description' /><meta property='og:title' content='$title' /><meta property='og:url' content='$url' /><meta property='og:type' content='website' /><meta property='og:image' content='$image' />";
    }

    $response = get();
    $title = $response->title;
    $description = $response->description;
    $image = $response->image;
    $url = $response->url;
?>
