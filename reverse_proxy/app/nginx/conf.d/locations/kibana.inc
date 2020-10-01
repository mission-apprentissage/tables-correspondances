location /kibana {
    proxy_set_header        Host $host;
    proxy_set_header        X-Real-IP $remote_addr;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header        X-Forwarded-Host $server_name;
    proxy_set_header        X-Forwarded-Proto $scheme;

    error_page              401 /401$request_uri;
    proxy_pass              http://kibana:5601/;
    proxy_redirect          http://kibana:5106 https://$host/kibana;
    rewrite                 /kibana/(.*)$ /$1 break;
}