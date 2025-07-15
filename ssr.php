<?php
    function get(){
        $uri = $_SERVER['REQUEST_URI'];
        $hasSlash = substr($uri,-1) === '/';
        if(!$hasSlash){
            $uri .= '/';
        }

        // Why..
        if(strpos($uri, 'contact') !== false || strpos($uri, 'expos') !== false){
            $uri = rtrim($uri, "/");
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
        }

        if(empty($description)){
            $description = 'Artiste sculpteur sur Fer | Nice';
        }

        if(empty($image)){
            $image = 'https://base.cheno.fr/wp-content/uploads/2019/12/logo-300x139.png';
        }

        $marker = '';
        if(strpos($title, ' | Cheno') !== false){
            $marker = "<meta name='helmetized' content='done'>";
        }

        return "<title>$title</title>$marker<meta name='description' content='$description' /><meta property='og:title' content='$title' /><meta property='og:url' content='$url' /><meta property='og:type' content='website' /><meta property='og:image' content='$image' />";
    }

    $response = get();
    $title = $response !== null && (property_exists($response, 'title') && isset($response->title)) ? $response->title : 'Cheno';

    if(strpos($title, '404') !== false){
        header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");
    }
    

    $description = $response !== null && (property_exists($response, 'description') && isset($response->description)) ? $response->description : "Artiste sculpteur sur Fer | Nice";
    $image = $response !== null && (property_exists($response, 'image') && isset($response->image)) ? $response->image : 'https://base.cheno.fr/wp-content/uploads/2019/12/logo-300x139.png';
    $url = $response !== null && (property_exists($response, 'url') && isset($response->url)) ? $response->url : 'https://www.cheno.fr' . $_SERVER['REQUEST_URI'];
?>
