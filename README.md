# FiLog

Project for HackGT12 @ GeorgiaTech U.S.A.

This code constitues a proof of concept of the dashboard of our innovative medical device.

All the components run on a docker virtual network

~~~
docker network create <network_name>
~~~

- Backend

We need to build and run the docker image.
~~~
cd backend
docker build -t backend_img .
docker run -d --name backend --network <network_name> -p <virtual_port>:<host_port> backend_img
~~~

- Fronted

We can run the developement server using `npm run dev` inside the frontend webpage.

