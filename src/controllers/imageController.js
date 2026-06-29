import {
  uploadProductImage,
  deleteProductImage,
} from '../services/imageService.js'
import { getProductById, updateProduct } from '../services/productService.js'

/**
 * Upload images to a product
 * Max 10 images per product
 */
export async function postProductImages(request, response) {
  try {
    const { id: productId } = request.validated.params
    const files = request.files

    if (!files || files.length === 0) {
      return response.status(400).json({ message: 'No files uploaded' })
    }

    // Get current product
    const product = await getProductById(productId)
    if (!product) {
      return response.status(404).json({ message: 'Product not found' })
    }

    // Check total image count won't exceed 10
    const currentImages = product.images || []
    if (currentImages.length + files.length > 10) {
      return response.status(400).json({
        message: `Cannot exceed 10 images. Current: ${currentImages.length}, Trying to add: ${files.length}`,
      })
    }

    // Upload all files to Firebase Storage
    const uploadedUrls = await Promise.all(files.map((file) => uploadProductImage(file, productId)))

    // Update product with new images
    const updatedImages = [...currentImages, ...uploadedUrls]
    const primaryImage = product.image || currentImages[0] || uploadedUrls[0] || ''
    const updatedProduct = await updateProduct(productId, {
      images: updatedImages,
      image: primaryImage,
    })

    response.status(201).json({
      message: `${uploadedUrls.length} image(s) uploaded successfully`,
      images: uploadedUrls,
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Error uploading product images:', error)
    response.status(error.statusCode || 500).json({
      message: error.message || 'Failed to upload images',
    })
  }
}

/**
 * Delete a specific image from a product
 */
export async function deleteProductImageByUrl(request, response) {
  try {
    const { id: productId } = request.validated.params
    const { imageUrl } = request.validated.query

    if (!imageUrl) {
      return response.status(400).json({ message: 'imageUrl query parameter required' })
    }

    // Get current product
    const product = await getProductById(productId)
    if (!product) {
      return response.status(404).json({ message: 'Product not found' })
    }

    // Remove image from array
    const updatedImages = (product.images || []).filter((url) => url !== imageUrl)

    // If deleted image was the primary, set new primary
    let primaryImage = product.image
    if (product.image === imageUrl) {
      primaryImage = updatedImages[0] || null
    }

    // Delete from Firebase Storage
    await deleteProductImage(imageUrl)

    // Update product
    const updatedProduct = await updateProduct(productId, {
      images: updatedImages,
      image: primaryImage,
    })

    response.json({
      message: 'Image deleted successfully',
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Error deleting product image:', error)
    response.status(error.statusCode || 500).json({
      message: error.message || 'Failed to delete image',
    })
  }
}

/**
 * Reorder product images
 */
export async function patchProductImageOrder(request, response) {
  try {
    const { id: productId } = request.validated.params
    const { imageUrls } = request.validated.body

    if (!Array.isArray(imageUrls)) {
      return response.status(400).json({ message: 'imageUrls must be an array' })
    }

    // Get current product
    const product = await getProductById(productId)
    if (!product) {
      return response.status(404).json({ message: 'Product not found' })
    }

    // Verify all URLs exist in current images
    const currentImages = product.images || []
    const validUrls = imageUrls.filter((url) => currentImages.includes(url))

    if (validUrls.length !== imageUrls.length) {
      return response.status(400).json({ message: 'Invalid image URLs provided' })
    }

    // Update product with new order
    const updatedProduct = await updateProduct(productId, {
      images: validUrls,
      // Set primary image to first in new order
      image: validUrls[0] || product.image,
    })

    response.json({
      message: 'Image order updated successfully',
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Error reordering product images:', error)
    response.status(error.statusCode || 500).json({
      message: error.message || 'Failed to reorder images',
    })
  }
}
