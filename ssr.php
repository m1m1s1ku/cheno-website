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

        echo "<div class='debug-ssr'>$url</div>";
        echo "<div class='debug-ssr'>$response</div>";

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
        <meta name='description' content="$description" />
        <meta property='og:title' content="$title" />
        <meta property='og:url' content="$url" />
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
