package com.settleup.settleup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class SettleupApplication {

	public static void main(String[] args) {
		SpringApplication.run(SettleupApplication.class, args);
	}

}
