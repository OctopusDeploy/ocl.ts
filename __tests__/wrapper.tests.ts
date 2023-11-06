import {parseOclWrapper} from "../src/wrapper";

test("Wrapper OCL property access", () => {
    const wrapper = parseOclWrapper(`
step "back-up-store-client-filesystem" {
    name = "Upgrade POS client software"
    number_value = 10
    bool_value = false
    properties = {
        Octopus.Action.MaxParallelism = "100"
        Octopus.Action.TargetRoles = "pos-client"
    }

    action "back-up-store-client-filesystem" {
        action_type = "Octopus.Script"
        name = "Back up store client filesystem"
        properties = {
            Octopus.Action.RunOnServer = "false"
            Octopus.Action.Script.ScriptBody = <<-EOT
                Write-Highlight "Backing up store client filesystem"
                
                Start-Sleep 2
                
                Write-Highlight "Finished backing up store client filesystem"
                
                    EOT
            Octopus.Action.Script.ScriptSource = "Inline"
            Octopus.Action.Script.Syntax = "PowerShell"
        }
    }

    action "upgrade-store-client-software" {
        action_type = "Octopus.Script"
        name = "Upgrade store client software"
        properties = {
            Octopus.Action.RunOnServer = "false"
            Octopus.Action.Script.ScriptBody = <<-EOT
                $current = $OctopusParameters["Octopus.Release.Previous.Number"]
                $new = $OctopusParameters["Octopus.Release.Number"]
                
                Write-Highlight "Upgrading store client software"
                Write-Highlight "Current version is $current"
                Write-Highlight "New version is $new"
                
                Start-Sleep 2
                
                Write-Highlight "Finished upgrading store client software"
                    EOT
            Octopus.Action.Script.ScriptSource = "Inline"
            Octopus.Action.Script.Syntax = "PowerShell"
        }

        packages "Pos.Client.Application" {
            acquisition_location = "Server"
            feed = "octopus-server-built-in"
            package_id = "Pos.Client.Application"
            properties = {
                Extract = "False"
                Purpose = ""
                SelectionMode = "immediate"
            }
            
            properties = {
                Extract = "False"
                Purpose = "Second properties"
                SelectionMode = "immediate"
            }
        }
        
        packages "Pos.Client.Application" {
            acquisition_location = "Server"
            feed = "octopus-server-built-in"
            package_id = "Pos.Client.Application"
            properties = {
                Extract = "False"
                Purpose = ""
                SelectionMode = "immediate"
            }
            
            properties = {
                Extract = "False"
                Purpose = "Third properties"
                SelectionMode = "immediate"
            }
        }
    }
}

step "back-up-store-server-filesystem" {
    name = "Back up store server filesystem"
    properties = {
        Octopus.Action.TargetRoles = "pos-server"
    }

    action {
        action_type = "Octopus.Script"
        properties = {
            Octopus.Action.RunOnServer = "false"
            Octopus.Action.Script.ScriptBody = <<-EOT
                Write-Highlight "Backing up store server filesystem"
                
                Start-Sleep 5
                
                Write-Highlight "Finished backing up store server filesystem"
                    EOT
            Octopus.Action.Script.ScriptSource = "Inline"
            Octopus.Action.Script.Syntax = "PowerShell"
        }
    }
}

step "upgrade-store-server-database" {
    name = "Upgrade store server database"
    properties = {
        Octopus.Action.TargetRoles = "pos-server"
    }

    action {
        action_type = "Octopus.Script"
        properties = {
            Octopus.Action.RunOnServer = "false"
            Octopus.Action.Script.ScriptBody = <<-EOT
                $connection = $OctopusParameters["Pos.Server.Database.ConnectionString"]
                $new = $OctopusParameters["Octopus.Release.Number"]
                
                Write-Highlight "Upgrading store server database"
                Write-Highlight "Using connection string: $connection"
                Write-Highlight "Applying migrations for version $new"
                
                Start-Sleep 5
                
                Write-Highlight "Finished upgrading store server database"
                    EOT
            Octopus.Action.Script.ScriptSource = "Inline"
            Octopus.Action.Script.Syntax = "PowerShell"
        }

        packages "Pos.Server.Migrations" {
            acquisition_location = "Server"
            feed = "octopus-server-built-in"
            package_id = "Pos.Server.Migrations"
            properties = {
                Extract = "False"
                Purpose = ""
                SelectionMode = "immediate"
            }
        }
    }
}

step "upgrade-store-server-software" {
    name = "Upgrade store server software"
    properties = {
        Octopus.Action.TargetRoles = "pos-server"
    }

    action {
        action_type = "Octopus.Script"
        properties = {
            Octopus.Action.RunOnServer = "false"
            Octopus.Action.Script.ScriptBody = <<-EOT
                $current = $OctopusParameters["Octopus.Release.Previous.Number"]
                $new = $OctopusParameters["Octopus.Release.Number"]
                
                Write-Highlight "Upgrading store server software"
                Write-Highlight "Current version is $current"
                Write-Highlight "New version is $new"
                
                Start-Sleep 5
                
                Write-Highlight "Finished upgrading store server software"
                    EOT
            Octopus.Action.Script.ScriptSource = "Inline"
            Octopus.Action.Script.Syntax = "PowerShell"
        }

        packages "Pos.Server.Application" {
            acquisition_location = "Server"
            feed = "octopus-server-built-in"
            package_id = "Pos.Server.Application"
            properties = {
                Extract = "False"
                Purpose = ""
                SelectionMode = "immediate"
            }
        }
    }
}

int_attribute = 1

properties = {
    Extract = "False"
    Purpose = ""
    SelectionMode = "immediate"
}`)

    const json = JSON.stringify(wrapper, null, 2)
    const parsedJson = JSON.parse(json)

    console.log(json)

    // wrapper is read only
    wrapper.test = 'test'
    expect(wrapper.test).toBeUndefined()
    expect(parsedJson.test).toBeUndefined()

    // The root node exposes blocks as an array
    expect(wrapper.step.length).toEqual(4)

    // Here we access the first step
    expect(wrapper.step[0].action.length).toEqual(2)
    expect(parsedJson[0].action.length).toEqual(2)
    expect(wrapper.step[1].action.length).toEqual(1)
    expect(parsedJson[1].action.length).toEqual(1)

    // here we read the last item, which is a floating attribute
    expect(wrapper.int_attribute).toEqual(1)
    expect(parsedJson[4].int_attribute).toEqual(1)

    // Nodes are also accessible via labels. Here we access the step via its label
    expect(wrapper.step["back-up-store-client-filesystem"].action.length).toEqual(2)
    expect(parsedJson.filter((s: any) => s.__labels?.includes("back-up-store-client-filesystem"))[0].action.length).toEqual(2)
    expect(wrapper.step["back-up-store-server-filesystem"].action.length).toEqual(1)
    expect(parsedJson.filter((s: any) => s.__labels?.includes("back-up-store-server-filesystem"))[0].action.length).toEqual(1)

    // Missing labels are undefined
    expect(wrapper.step["does-not-exist"]).toBeUndefined()

    // Some special properties to access a block's name and labels
    expect(wrapper.step["back-up-store-client-filesystem"].__labels[0]).toEqual("back-up-store-client-filesystem")
    expect(wrapper.step["back-up-store-client-filesystem"].__labels.length).toEqual(1)
    expect(parsedJson.filter((s: any) => s.__labels?.includes("back-up-store-client-filesystem"))[0].__labels.length).toEqual(1)
    expect(wrapper.step["back-up-store-client-filesystem"].__name).toEqual("step")

    // More tests that drill deeper into the structure
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['Pos.Client.Application'][0].properties[0].Purpose).toEqual("")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['Pos.Client.Application'][0].properties[0].Purpose).toEqual("")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['does-not-exist']).toBeUndefined()
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['Pos.Client.Application'][0].properties[1].Purpose).toEqual("Second properties")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['Pos.Client.Application'][1].properties[1].Purpose).toEqual("Third properties")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].packages['Pos.Client.Application'][1].properties[0].Purpose).toEqual("")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].properties['Octopus.Action.RunOnServer']).toEqual("false")
    expect(wrapper.step["back-up-store-client-filesystem"].action[0].properties['Octopus.Action.RunOnServer']).toEqual("false")
    expect(wrapper.step["back-up-store-client-filesystem"].action['upgrade-store-client-software'].__name).toEqual("action")
    expect(wrapper.step["back-up-store-client-filesystem"].name).toEqual("Upgrade POS client software")
    expect(wrapper.step["back-up-store-client-filesystem"].number_value).toEqual(10)
    expect(wrapper.step["back-up-store-client-filesystem"].bool_value).toBeFalsy()
    expect(wrapper.step["back-up-store-client-filesystem"].properties['Octopus.Action.MaxParallelism']).toEqual("100")
    expect(wrapper.step["back-up-store-client-filesystem"].action['back-up-store-client-filesystem'].action_type).toEqual("Octopus.Script")
    expect(wrapper.step["back-up-store-client-filesystem"].action[1].action_type).toEqual("Octopus.Script")

})