const file1 = `{\n
  comp_info: {\n
    version: "1.0.0",\n
    name: "product-tcs-base",\n
  },\n
  deploy: {\n
    iplist: {\n
      global_master: __redis_master_ip__,\n
      global_node: __Gaia_IP_0__,\n
    },\n
    viplist: {\n
      lb_keepalived_viplist: [\n
        data.param.lb_keepalived_vip, //k8s lb_keepalived_viplist\n
      ],\n
      vip: [\n
        data.param.apiserver_vip, //k8s Master API VIP\n
      ],\n
    },\n
  },\n
  private: {\n
    auth_ca_cert: "",\n
    auth_client_id: "",\n
    auth_issuer_url: "",\n
    auth_type: "tke",\n
    etcd_dir: data.param.localpv_base_path.concat("/var/lib/etcd"),\n
    eth_name: data.host[0]["net-card"],\n
    gateway_cert: "tke",\n
    gateway_certificate: "",\n
    gateway_private_key: "",\n
    gateway_pwd: __gatway_pwd__,\n
    gateway_subdomain: "tke.tcs",\n
    gateway_user: "admin",\n
    ha_type: "thirdParty",\n
    ha_vport: 6443,\n
    init_jobs: "set_master_taint_and_tke_toleration,create_registry_namespace,move_local_registry_storage,enable_registry_anonymous,set_kubeproxy_metrics_bind_address,create_tce_default_rbac,add_check_kubelet_nic_error_crontab,add_clean_log_crontab",
    customized_jobs: tke_customized_jobs,\n
    tcs_components: "cert-manager,service-catalog,statefulsetplus-operator,oamctl,coredns,pajero,oam-controller,keepalived-cloud-provider,kube-keepalived-vip,nginx-ingress-controller,sd-controller,assets,csi-driver-localpv,scheduler-extender,zookeeper-service,ces-service,kafka-service,tdsql-service,credis-service,service-toolbox,reloadercert-manager,service-catalog,statefulsetplus-operator,oamctl,coredns,pajero,oam-controller,keepalived-cloud-provider,kube-keepalived-vip,nginx-ingress-controller,sd-controller,assets,csi-driver-localpv,scheduler-extender,rabbitmq-service,zookeeper-service,ces-service,kafka-service,mongo-service,tdsql-service,credis-service,service-toolbox,vpcservice-controller,reloader,cmq-service,kubelet",\n
    floatingips: [\n
      {\n
        routableSubnet: data.param.floating_routableSubnet,\n
        ips: [data.param.floating_ips],\n
        subnet: data.param.floating_subnet,\n
        gateway: data.param.floating_gateway,\n
      },\n
    ],\n
    keepalived_use_unicast: tke_keepalived_use_unicast,\n
    localpv_base_path: data.param.localpv_base_path,\n
    monitor_store_pwd: "",\n
    monitor_store_type: "influxdbLocal",\n
    monitor_store_url: "",\n
    monitor_store_user: "",\n
    product_install_path: "/data/product-tcenter-tcs",\n
    registry_apikey_expire: "876000h",\n
    registry_domain: "registry.tce.com",\n
    registry_namespace: "",\n
    registry_pwd: "",\n
    registry_type: "tke",\n
    registry_user: "",\n
    ssh_port: Number(data.host[0]["ssh-port"]),\n
    ssh_pwd: data.host[0].passwd,\n
    ssh_user: "root",\n
    taint_num: tke_taint_num,\n
    tcs_coredns_replicas: 4,\n
    tcs_coredns_upstream: [],\n
    tcs_registry_create_namespace: "infra,tce",\n
    tcs_registry_namespace: "infra",\n
    tcs_sd_port: "30150",\n
    tce_dc_workspace: "/data/tce_dc/workspace",\n
    tce_dc_product_path: "/data/tce_dc/software/latest/product",\n
    use_multiple_az_tgw_set: "false",\n
  },\n
  base: {\n
    local: {\n
      domain_main: data.param.domain_main,\n
      l4_vip: {},\n
      l7_vip: {},\n
    },\n
  },\n
}`;

window.fileList = {
  file1,
};
