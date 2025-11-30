package com.settleup.settleup.shared;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactRouterController {
    // Regex matches any path that does NOT start with /api or contain a dot (like .js, .css)
    @RequestMapping(value = "/**/{path:[^\\.]*}")
    public String forward() {
        return "forward:/index.html";
    }
}