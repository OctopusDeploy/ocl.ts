import {parseSteps} from "../src/wrapper";

test("Wrapper OCL property access", () => {
    const wrapper = parseSteps(`step "back-up-store-client-filesystem" {
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
    }
}`)

    expect(wrapper[0].action['upgrade-store-client-software'].properties['Octopus.Action.RunOnServer']).toEqual("false")
    expect(wrapper[0].action['upgrade-store-client-software'].packages['Pos.Client.Application'].properties[1].Purpose).toEqual("Second properties")
    expect(wrapper[0].action['upgrade-store-client-software'].packages['Pos.Client.Application'].properties[0].Purpose).toEqual("")
    expect(wrapper[0].name).toEqual("Upgrade POS client software")
    expect(wrapper[0].number_value).toEqual(10)
    expect(wrapper[0].bool_value).toBeFalsy()
    expect(wrapper[0].properties['Octopus.Action.MaxParallelism']).toEqual("100")
    expect(wrapper[0].action['back-up-store-client-filesystem'].action_type).toEqual("Octopus.Script")


})