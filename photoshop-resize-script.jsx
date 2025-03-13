// Batch Resize Script for Adobe Photoshop
// This script resizes all images in a selected folder to user-specified dimensions
// with options to copy or replace original files

// Enable double clicking from the Finder/Explorer
#target photoshop

// Function to show a dialog for user input
function getUserInput() {
    // Create dialog
    var dlg = new Window("dialog", "Batch Image Resize");
    
    // Add panel for resize dimensions
    var sizePanel = dlg.add("panel", undefined, "Resize Dimensions");
    sizePanel.orientation = "row";
    sizePanel.alignChildren = "left";
    
    // Width input
    var widthGroup = sizePanel.add("group");
    widthGroup.add("statictext", undefined, "Width (px):");
    var widthInput = widthGroup.add("edittext", undefined, "800");
    widthInput.characters = 6;
    
    // Height input
    var heightGroup = sizePanel.add("group");
    heightGroup.add("statictext", undefined, "Height (px):");
    var heightInput = heightGroup.add("edittext", undefined, "600");
    heightInput.characters = 6;
    
    // Add panel for file handling options
    var optionsPanel = dlg.add("panel", undefined, "File Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";
    
    // Radio buttons for copy or replace
    var copyRadio = optionsPanel.add("radiobutton", undefined, "Create copies (original_name_resized.ext)");
    var replaceRadio = optionsPanel.add("radiobutton", undefined, "Replace original files");
    copyRadio.value = true; // Default to copy
    
    // Add buttons
    var btnGroup = dlg.add("group");
    btnGroup.orientation = "row";
    var okBtn = btnGroup.add("button", undefined, "OK", {name: "ok"});
    var cancelBtn = btnGroup.add("button", undefined, "Cancel", {name: "cancel"});
    
    // Show dialog
    if (dlg.show() == 1) {
        return {
            width: parseInt(widthInput.text),
            height: parseInt(heightInput.text),
            createCopy: copyRadio.value
        };
    } else {
        return null; // User canceled
    }
}

// Function to select a folder
function selectFolder() {
    var folder = Folder.selectDialog("Select a folder with images to resize");
    return folder;
}

// Main function to process images
function processImages(folder, options) {
    // Exit if folder is null (user canceled)
    if (folder == null) return;
    
    // Get all files in the folder
    var fileList = folder.getFiles(/\.(jpg|jpeg|png|tif|tiff|psd|gif)$/i);
    
    if (fileList.length == 0) {
        alert("No supported image files found in the selected folder.");
        return;
    }
    
    // Display progress
    var progressWin = new Window("palette", "Processing Images...");
    progressWin.orientation = "column";
    progressWin.alignChildren = ["center", "top"];
    
    var progressBar = progressWin.add("progressbar", undefined, 0, fileList.length);
    progressBar.preferredSize.width = 300;
    
    var statusText = progressWin.add("statictext", undefined, "");
    statusText.preferredSize.width = 300;
    
    progressWin.show();
    
    // Set ruler units to pixels
    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    
    // Process each file
    for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i];
        
        // Update progress
        progressBar.value = i + 1;
        statusText.text = "Processing: " + file.name + " (" + (i + 1) + " of " + fileList.length + ")";
        progressWin.update();
        
        try {
            // Open the document
            var doc = app.open(file);
            
            // Resize the image
            doc.resizeImage(UnitValue(options.width, "px"), UnitValue(options.height, "px"), null, ResampleMethod.BICUBIC);
            
            // Save the file
            if (options.createCopy) {
                // Create a new file name with "_resized" suffix
                var path = file.path;
                var baseName = file.name.replace(/\.[^\.]+$/, '');
                var extension = file.name.match(/\.[^\.]+$/)[0];
                var newFileName = baseName + "_resized" + extension;
                var saveFile = new File(path + "/" + newFileName);
                
                // Save as a copy
                if (extension.toLowerCase() == '.psd') {
                    doc.saveAs(saveFile, new PhotoshopSaveOptions(), true, Extension.LOWERCASE);
                } else if (extension.toLowerCase() == '.jpg' || extension.toLowerCase() == '.jpeg') {
                    doc.saveAs(saveFile, new JPEGSaveOptions(), true, Extension.LOWERCASE);
                } else if (extension.toLowerCase() == '.png') {
                    doc.saveAs(saveFile, new PNGSaveOptions(), true, Extension.LOWERCASE);
                } else if (extension.toLowerCase() == '.tif' || extension.toLowerCase() == '.tiff') {
                    doc.saveAs(saveFile, new TiffSaveOptions(), true, Extension.LOWERCASE);
                } else {
                    // For other formats, use PhotoshopSaveOptions by default
                    doc.saveAs(saveFile, new PhotoshopSaveOptions(), true, Extension.LOWERCASE);
                }
            } else {
                // Save and replace the original
                doc.save();
            }
            
            // Close the document
            doc.close(SaveOptions.DONOTSAVECHANGES);
        }
        catch (e) {
            alert("Error processing " + file.name + ": " + e);
            
            // Try to close the document if it's open
            try {
                if (doc) {
                    doc.close(SaveOptions.DONOTSAVECHANGES);
                }
            } catch (closeError) {}
            
            continue; // Continue with next file
        }
    }
    
    // Restore original ruler units
    app.preferences.rulerUnits = originalRulerUnits;
    
    // Close progress window
    progressWin.close();
    
    // Show completion message
    alert("Batch resize complete! Processed " + fileList.length + " images.");
}

// Run the script
function main() {
    // Get user input
    var options = getUserInput();
    if (!options) return; // User canceled
    
    // Select folder
    var folder = selectFolder();
    if (!folder) return; // User canceled
    
    // Process images
    processImages(folder, options);
}

main();
